import OpenAI from 'openai'
export class AIService {
  constructor(private client: OpenAI, private model: string) {}
  async searchWeb(query: string) { return this.client.responses.create({ model: this.model, tools: [{ type: 'web_search' } as any], input: query }) }
  async generatePost(input: string) { return this.client.responses.create({ model: this.model, input: `Create a concise investor-grade social post. Human approval required.\n${input}` }) }
  async generateCommentReply(input: string) { return this.client.responses.create({ model: this.model, input: `Draft a selective, non-spammy reply to this relevant investment comment. Ask one useful question.\n${input}` }) }
  async summarizeResearch(input: string) { return this.client.responses.create({ model: this.model, input: `Summarize research, preserving sources and separating facts from inference.\n${input}` }) }
  async scoreOpportunity(input: string) { return this.client.responses.create({ model: this.model, input: `Score this investment opportunity 0-100 and explain fit, founder, market, traction, timing and risks. Return JSON.\n${input}` }) }
  async classifyComment(input: string) { return this.client.responses.create({ model: this.model, input: `Classify this comment for investment relevance. Return JSON with classification, confidence, signals, entities.\n${input}` }) }
  async extractEntities(input: string) { return this.client.responses.create({ model: this.model, input: `Extract company, person, funding, industry, stage and location as JSON.\n${input}` }) }
  async generateDailyBriefing(input: string) { return this.client.responses.create({ model: this.model, input: `Generate a concise daily investor intelligence briefing.\n${input}` }) }
  async analyzeWritingStyle(input: string) { return this.client.responses.create({ model: this.model, input: `Analyze approved writing examples and produce a style profile without impersonation.\n${input}` }) }
  async researchCompany(input: string) { return this.searchWeb(`Research company: ${input}. Include official site, founders, funding, market, recent news, risks and sources.`) }
  async researchFounder(input: string) { return this.searchWeb(`Research founder: ${input}. Include role, companies, public background, signals and sources.`) }
}
