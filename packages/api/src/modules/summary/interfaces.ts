export interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface EmailResponse {
  id: string;
  status: "success" | "error";
  message?: string;
}
