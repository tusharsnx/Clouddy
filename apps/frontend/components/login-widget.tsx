"use client";

import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { login } from "#/lib/login";
import { Progress } from "./ui/progress";

export default function LoginWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button id="login-btn" onClick={() => login("google")}>
          Login with Google
        </Button>

        {/* Todo: Add X button */}
        <Button id="login-btn">Login with X</Button>
        <Progress data-state="indeterminate" />
      </CardContent>
    </Card>
  );
}
