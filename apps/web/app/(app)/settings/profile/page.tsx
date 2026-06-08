'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { updateProfileSchema, changePasswordSchema } from '@vibe-crm/validators';
import { z } from 'zod';
import type { AuthUser } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { AvatarUpload } from '@/components/avatar-upload';
import { PageHeader } from '@/components/page-header';
import { FormSection, FormActions } from '@/components/forms/form-section';
import { Surface, SurfaceHeader } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

type ProfileInput = z.infer<typeof updateProfileSchema>;
type PasswordInput = z.infer<typeof changePasswordSchema>;

const labelClass = 'studio-label';

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const profileForm = useForm<ProfileInput>({
    resolver: formResolver<ProfileInput>(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: formResolver<PasswordInput>(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  useEffect(() => {
    apiClient
      .get<AuthUser>('/users/me')
      .then((u) => {
        setUser(u);
        profileForm.reset({
          firstName: u.firstName,
          lastName: u.lastName,
        });
      })
      .catch(() => undefined);
  }, [profileForm, setUser]);

  const onProfileSubmit = async (values: ProfileInput) => {
    setProfileError('');
    setProfileMsg('');
    try {
      const updated = await apiClient.patch<AuthUser>('/users/me', values);
      setUser(updated);
      setProfileMsg('Profile updated');
    } catch (err) {
      setProfileError(err instanceof ApiRequestError ? err.message : 'Update failed');
    }
  };

  const onPasswordSubmit = async (values: PasswordInput) => {
    setPasswordError('');
    setPasswordMsg('');
    try {
      await apiClient.post('/users/me/change-password', values);
      setPasswordMsg('Password changed');
      passwordForm.reset();
    } catch (err) {
      setPasswordError(err instanceof ApiRequestError ? err.message : 'Password change failed');
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader title="Profile" description="Manage your account settings" label="Settings" />

      <Surface padding="none">
        <SurfaceHeader>
          <div>
            <h2 className="text-sm font-medium">Personal info</h2>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </SurfaceHeader>
        <div className="p-5 space-y-5">
          <AvatarUpload
            user={user}
            onUpdated={(updated) => {
              if (user) setUser({ ...user, ...updated });
              setProfileMsg('Photo updated');
              setProfileError('');
            }}
          />
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
              <FormSection>
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
              {profileError && <p className="text-[11px] text-destructive">{profileError}</p>}
              {profileMsg && <p className="text-[11px] text-emerald-500/80">{profileMsg}</p>}
              <FormActions className="border-0 pt-0">
                <Button type="submit" size="sm" disabled={profileForm.formState.isSubmitting}>
                  Save changes
                </Button>
              </FormActions>
            </form>
          </Form>
        </div>
      </Surface>

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Appearance</h2>
        </SurfaceHeader>
        <div className="p-5">
          <p className="mb-3 text-[11px] text-muted-foreground">Choose light, dark, or match your system preference.</p>
          <ThemeToggle variant="full" />
        </div>
      </Surface>

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Change password</h2>
        </SurfaceHeader>
        <div className="p-5">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <FormSection>
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>Current password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelClass}>New password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
              {passwordError && <p className="text-[11px] text-destructive">{passwordError}</p>}
              {passwordMsg && <p className="text-[11px] text-emerald-500/80">{passwordMsg}</p>}
              <FormActions className="border-0 pt-0">
                <Button type="submit" size="sm" variant="secondary" disabled={passwordForm.formState.isSubmitting}>
                  Update password
                </Button>
              </FormActions>
            </form>
          </Form>
        </div>
      </Surface>
    </div>
  );
}
