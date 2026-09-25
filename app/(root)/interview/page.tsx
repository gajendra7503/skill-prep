import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  const userName = user?.name ?? "";

  return (
    <>
      <h3>Interview generation</h3>

      <Agent
        userName={userName}
        userId={user?.id}
        // profileImage={user?.profileURL}
        type="generate"
      />
    </>
  );
};

export default Page;
