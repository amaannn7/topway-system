import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminLoginAction, agentLoginAction } from "./actions";
import { AdminLoginForm, AgentLoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const { portal } = await searchParams;
  const defaultTab = portal === "agent" ? "agent" : "admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/brand/topway-logo.png"
            alt="Topway"
            width={140}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Topway Portal
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Choose the portal for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Staff</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>
              <TabsContent value="admin" className="mt-6 flex flex-col gap-4">
                <AdminLoginForm action={adminLoginAction} />
                <p className="text-center text-xs text-muted-foreground">
                  Forgot your password? Ask an owner to reset it from Settings → Team.
                </p>
              </TabsContent>
              <TabsContent value="agent" className="mt-6 flex flex-col gap-4">
                <AgentLoginForm action={agentLoginAction} />
                <p className="text-center text-xs text-muted-foreground">
                  Forgot your password? Contact Topway to have it reset.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
