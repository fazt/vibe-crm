import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionPlan, SubscriptionStatus } from '@vibe-crm/database';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DEFAULT_PIPELINE_STAGES, PlatformRoleSlug, WorkspaceRoleSlug } from '@vibe-crm/shared';
import { sendEmail, welcomeEmail, passwordResetEmail } from '@vibe-crm/emails';
import type { RegisterInput, LoginInput } from '@vibe-crm/validators';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private rbac: RbacService,
  ) {}

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private jwtSecret() {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-32chars';
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return amount * (multipliers[unit] ?? 86_400_000);
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.jwtSecret(),
        expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? '15m') as `${number}m`,
      },
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES ?? '7d';
    const expiresAt = new Date(Date.now() + this.parseDurationMs(refreshExpires));
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hashToken(refreshToken), expiresAt },
    });
    return { accessToken, refreshToken };
  }

  private async buildAuthUser(userId: string) {
    const ctx = await this.rbac.loadUserAuthContext(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
    return {
      ...user,
      role: ctx.role,
      permissions: ctx.platformPermissions,
      platformPermissions: ctx.platformPermissions,
      workspacePermissions: [],
      plan: ctx.plan,
      planLimits: ctx.planLimits,
      usage: ctx.usage,
      isSubscriber: ctx.isSubscriber,
      isSuperAdmin: ctx.isSuperAdmin,
    };
  }

  async register(dto: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slug = (dto.workspaceName ?? `${dto.firstName}-workspace`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const userRoleId = await this.rbac.getPlatformRoleId(PlatformRoleSlug.USER);
    const ownerRoleId = await this.rbac.getWorkspaceRoleId(WorkspaceRoleSlug.OWNER);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: userRoleId,
        subscription: {
          create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
        },
      },
    });

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.workspaceName ?? `${dto.firstName}'s Workspace`,
        slug: `${slug}-${Date.now().toString(36)}`,
        pipelineStages: {
          create: DEFAULT_PIPELINE_STAGES.map((s) => ({
            name: s.name,
            color: s.color,
            order: s.order,
            isWon: s.isWon,
            isLost: s.isLost,
          })),
        },
        members: {
          create: { userId: user.id, roleId: ownerRoleId },
        },
      },
      include: { members: { include: { role: true } } },
    });

    const membership = workspace.members[0];
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Vibe CRM',
      html: welcomeEmail(user.firstName, workspace.name),
    });

    const tokens = await this.generateTokens(user.id, user.email);
    const authUser = await this.buildAuthUser(user.id);
    return {
      user: authUser,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: {
          id: membership.role.id,
          slug: membership.role.slug,
          name: membership.role.name,
        },
      },
      ...tokens,
    };
  }

  getGithubAuthUrl(): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/auth/github/callback';
    if (!clientId) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'read:user user:email',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleGithubCallback(code: string): Promise<string> {
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    if (!code) {
      return `${webUrl}/login?error=github_missing_code`;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/auth/github/callback';
    if (!clientId || !clientSecret) {
      return `${webUrl}/login?error=github_not_configured`;
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl }),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return `${webUrl}/login?error=github_token_failed`;
    }

    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
      }),
    ]);

    const profile = (await profileRes.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string | null;
      email: string | null;
    };
    const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.verified)?.email ??
      profile.email;

    if (!primaryEmail) {
      return `${webUrl}/login?error=github_no_email`;
    }

    const githubId = String(profile.id);
    const [firstName, ...rest] = (profile.name ?? profile.login).split(' ');
    const lastName = rest.join(' ') || profile.login;

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ githubId }, { email: primaryEmail }] },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubId,
          avatarUrl: profile.avatar_url ?? user.avatarUrl,
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
        },
      });
    } else {
      const userRoleId = await this.rbac.getPlatformRoleId(PlatformRoleSlug.USER);
      const ownerRoleId = await this.rbac.getWorkspaceRoleId(WorkspaceRoleSlug.OWNER);

      user = await this.prisma.user.create({
        data: {
          email: primaryEmail,
          githubId,
          firstName,
          lastName,
          avatarUrl: profile.avatar_url,
          roleId: userRoleId,
          subscription: {
            create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
          },
        },
      });

      await this.prisma.workspace.create({
        data: {
          name: `${firstName}'s Workspace`,
          slug: `${profile.login.toLowerCase()}-${Date.now().toString(36)}`,
          pipelineStages: {
            create: DEFAULT_PIPELINE_STAGES.map((s) => ({
              name: s.name,
              color: s.color,
              order: s.order,
              isWon: s.isWon,
              isLost: s.isLost,
            })),
          },
          members: {
            create: { userId: user.id, roleId: ownerRoleId },
          },
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return `${webUrl}/github/callback?${params.toString()}`;
  }

  async login(dto: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.generateTokens(user.id, user.email);
    const authUser = await this.buildAuthUser(user.id);
    return { user: authUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.email);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link was sent' };

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.WEB_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Vibe CRM password',
      html: passwordResetEmail(user.firstName, resetUrl),
    });
    return { message: 'If the email exists, a reset link was sent' };
  }

  async resetPassword(token: string, password: string) {
    const stored = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!stored || stored.used || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      this.prisma.passwordReset.update({ where: { id: stored.id }, data: { used: true } }),
    ]);
    return { message: 'Password updated' };
  }
}
