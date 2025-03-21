import { v4 as uuidv4 } from "uuid";
import { EmailPayload, EmailResponse } from "./interfaces";
import { emailPayloadSchema } from "./schemas";

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendSummaryEmail(): Promise<EmailResponse> {
  const to_email = process.env.TO_EMAIL;
  const resend_api_key = process.env.RESEND_API_KEY;

  if (!to_email || !resend_api_key) {
    throw new Error("Missing required environment variables");
  }

  const summary_html = await generateDailySummaryHtml();

  const email_payload: EmailPayload = {
    from: "delivered@resend.dev",
    to: to_email,
    subject: `Your Daily Summary - ${new Date().toLocaleDateString()}`,
    html: summary_html,
  };

  console.log("This is payload: ");
  console.log(email_payload);

  // Validate payload
  const validation_result = emailPayloadSchema.safeParse(email_payload);
  if (!validation_result.success) {
    throw new Error(
      `Invalid email payload: ${validation_result.error.message}`
    );
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "hello world",
      react: <EmailTemplate firstName="John" />,
    });

    if (error) {
      return c.json(error, 400);
    }

    return c.json(data);
  } catch (error) {
    return {
      id: uuidv4(),
      status: "error",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
