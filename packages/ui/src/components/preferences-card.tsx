"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { ThemePreferenceControl } from "./theme";

/** Settings -> Preferences, identical in the Business Console and the admin console. Saved on this device. */
export function PreferencesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Automatic switches between light and dark with the time of day where you are. Saved on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThemePreferenceControl />
      </CardContent>
    </Card>
  );
}
