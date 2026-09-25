import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { Link } from 'expo-router';
import { loginSchema } from '@napayment/schemas';
import { AuthShell, authStyles } from '@/components/auth-shell';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FormError } from '@/components/form-error';
import { ShowToggle } from '@/components/show-toggle';
import { AppText } from '@/components/text';
import { useSession } from '@/hooks/use-session';
import { errorMessage } from '@/lib/api';
import { validate } from '@/lib/validation';
import { colors } from '@/theme';

// Backend login is email + password (LoginRequest) - the design's phone field waits on phone login.
export default function SignInScreen() {
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const result = validate(loginSchema, { email: email.trim(), password });
    setErrors(result.errors);
    if (!result.ok) return;
    setBusy(true);
    setFormError(null);
    try {
      await signIn(result.data);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <FormError message={formError} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        suffix={<ShowToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <Button title="Sign in" onPress={submit} loading={busy} style={{ marginTop: 4 }} />
      <View style={authStyles.links}>
        <Link href="/forgot-password" accessibilityRole="link">
          <AppText size={13} weight="semibold" color={colors.brand}>
            Forgot password?
          </AppText>
        </Link>
        <AppText size={13} color={colors.muted}>
          New here?{' '}
          <Link href="/sign-up" accessibilityRole="link">
            <AppText size={13} weight="semibold" color={colors.brand}>
              Sign up
            </AppText>
          </Link>
        </AppText>
      </View>
    </AuthShell>
  );
}
