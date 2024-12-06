import { FC, FormEventHandler, useState } from "react";
import {
  useConnectWithOtp,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";

export const ConnectWithEmailView: FC = () => {
  const { user } = useDynamicContext();
  const [email, setEmail] = useState("");
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    const email = event.currentTarget.email.value;
    setEmail(email);
    await connectWithEmail(email);
  };

  const onSubmitOtpHandler: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    const otp = event.currentTarget.otp.value;

    await verifyOneTimePassword(otp);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-4 w-full">
      <form
        className="w-full flex flex-col gap-4"
        key="email-form"
        onSubmit={!email ? onSubmitEmailHandler : onSubmitOtpHandler}
      >
        {!email ? (
          <input
            className="w-full rounded-lg border-2 border-border px-4 py-2 text-white bg-input text-sm"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
        ) : (
          <input
            className="w-full rounded-lg border-2 border-border px-4 py-2 text-white bg-input text-sm"
            type="number"
            name="otp"
            placeholder="OTP"
            required
          />
        )}

        <button
          className="bg-primary w-full px-2 py-1.5 rounded-lg border-2 border-border font-semibold"
          type="submit"
        >
          {!email ? "Submit" : "Verify"}
        </button>
      </form>

      {!!user && (
        <>
          <p>Authenticated user:</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </>
      )}
    </div>
  );
};
