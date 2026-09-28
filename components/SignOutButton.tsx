"use client";

import { toast } from "sonner";
import { signOut as firebaseSignOut } from "@firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/firebase/client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth.action";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      await signOut();

      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
};

export default SignOutButton;
