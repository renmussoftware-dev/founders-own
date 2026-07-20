import { Stack } from 'expo-router';
import { ob } from '@/content/onboarding';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ob.bgBottom },
      }}
    />
  );
}
