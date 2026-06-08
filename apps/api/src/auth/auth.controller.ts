import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@vibe-crm/validators';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) body: unknown) {
    return this.auth.register(body as Parameters<AuthService['register']>[0]);
  }

  @Public()
  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: unknown) {
    return this.auth.login(body as Parameters<AuthService['login']>[0]);
  }

  @Public()
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: { email: string }) {
    return this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: { token: string; password: string }) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @Public()
  @Get('github')
  githubRedirect(@Res() res: Response) {
    return res.redirect(this.auth.getGithubAuthUrl());
  }

  @Public()
  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    const redirectUrl = await this.auth.handleGithubCallback(code);
    return res.redirect(redirectUrl);
  }
}
