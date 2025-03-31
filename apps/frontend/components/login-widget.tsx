import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import Logo from "#/components/ui/logo";

type Props = {
  onLogin: (provider: string) => void;
};

export default function LoginWidget({ onLogin }: Props) {
  return (
    <Card className="text-center aspect-video bg-[#111111]">
      <CardHeader>
        <div className="flex items-center justify-center">
          <Logo />
        </div>
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>Sign in to continue</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button id="login-btn" onClick={() => onLogin("google")}>
          Login with Google
        </Button>
      </CardContent>
    </Card>
  );
}
