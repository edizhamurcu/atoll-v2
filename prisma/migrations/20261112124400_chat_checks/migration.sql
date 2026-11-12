ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_role_check" CHECK ("role" IN ('user', 'assistant'));
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_tokens_check" CHECK ("inputTokens" >= 0 AND "outputTokens" >= 0 AND "costUsd" >= 0);
ALTER TABLE "ChatUsage" ADD CONSTRAINT "ChatUsage_nonneg_check" CHECK ("requests" >= 0 AND "inputTokens" >= 0 AND "outputTokens" >= 0 AND "costUsd" >= 0);
