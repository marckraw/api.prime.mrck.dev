import { Hono } from "hono";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const summary_routes = new Hono();

summary_routes.get("/send-summary", async (c) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Marcin Krawczyk <onboarding@resend.dev>",
      to: ["marckraw@icloud.com"],
      subject: `Your Daily Summary - ${new Date().toLocaleDateString()} at ${new Date().getHours()}:${new Date().getMinutes()}`,
      html: await generateDailySummaryHtml(),
    });

    if (error) {
      return c.json(error, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      500
    );
  }
});

async function generateDailySummaryHtml(): Promise<string> {
  // TODO: Replace with dynamic data later
  return `
    <h1>Good morning!</h1>
    <p>Here's your summary for today:</p>
    <ul>
      <li>📝 3 tasks due today</li>
      <li>📅 Weekly goal: Finish UI refactor</li>
    </ul>
    <p>Have a great day! 🚀</p>
  `;
}
