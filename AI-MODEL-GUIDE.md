# VoxelBot - AI Model Configuration Guide

## Quick Start: Switching AI Models

Your VoxelBot now supports both **OpenAI (GPT-4o)** and **Moonshot AI (Kimi K2.5)**!

### Current Setup

The app uses environment variables to control which AI provider and model to use. This means you can easily switch between models without changing any code.

### How to Switch Models

#### In Replit:

1. Go to the **Secrets** tab (🔒 lock icon in left sidebar)
2. Add or update these secrets:

**To use OpenAI GPT-4o (default):**
```
AI_PROVIDER = openai
AI_MODEL = gpt-4o
OPENAI_API_KEY = your-openai-key
```

**To use Kimi K2.5 (cheaper!):**
```
AI_PROVIDER = moonshot
AI_MODEL = kimi-k2.5
MOONSHOT_API_KEY = sk-Twk9nQhv4AJEZWCIvcg2fGkQNuBbgybcyKgzWKq8bBIvr523
```

**To use Kimi K2 Turbo (faster):**
```
AI_PROVIDER = moonshot
AI_MODEL = kimi-k2-turbo-preview
MOONSHOT_API_KEY = sk-Twk9nQhv4AJEZWCIvcg2fGkQNuBbgybcyKgzWKq8bBIvr523
```

3. **Restart your app** (Stop and Run again) for changes to take effect

---

## Model Comparison

### OpenAI GPT-4o
- **Cost**: $2.50 per million input tokens, $10.00 per million output
- **Speed**: Fast (~60 tokens/sec)
- **Context**: 128K tokens
- **Best for**: Familiar, proven performance

### Moonshot Kimi K2.5
- **Cost**: $0.60 per million input tokens, $2.50 per million output (**75% cheaper!**)
- **Speed**: Standard (~8 tokens/sec base, ~60 tokens/sec turbo)
- **Context**: 262K tokens (2x larger!)
- **Best for**: Cost-effective operation at scale

### Moonshot Kimi K2 Turbo
- **Cost**: $1.15 per million input tokens, $8.00 per million output (still cheaper than GPT-4o)
- **Speed**: Fast (~50-60 tokens/sec)
- **Context**: 128K tokens
- **Best for**: When you need Kimi's quality but faster responses

---

## Cost Estimate for VoxelBot

**Scenario**: 300 visitors/month, 5 questions each = 1,500 interactions

| Model | Monthly Cost (with caching) |
|-------|----------------------------|
| GPT-4o | ~$5.72 |
| Kimi K2.5 | ~$1.35 |
| **Savings** | **$4.37/month (76% cheaper)** |

**At 1,000 visitors/month**: Saves ~$14.55/month  
**At 5,000 visitors/month**: Saves ~$72.75/month

---

## Available Models

### OpenAI Models:
- `gpt-4o` - Latest multimodal model (recommended)
- `gpt-4o-mini` - Cheaper, faster, slightly less capable
- `gpt-4-turbo` - Previous generation

### Moonshot Models:
- `kimi-k2.5` - Latest, best performance (recommended)
- `kimi-latest` - Auto-selects best available
- `kimi-k2-thinking` - Reasoning mode (slower, more verbose)
- `kimi-k2-turbo-preview` - Faster responses
- `kimi-k2-0905-preview` - Specific version
- `moonshot-v1-128k` - Previous generation

---

## Testing Recommendations

1. **Start with GPT-4o** (your current setup) to establish a baseline
2. **Switch to Kimi K2.5** and test with representative questions
3. **Compare responses** for:
   - Accuracy
   - Tone (warmth, directness)
   - Following VoxelBot configuration instructions
   - Response time (user experience)
4. **Monitor in admin dashboard** for any issues

---

## Troubleshooting

**App won't start after changing secrets:**
- Check that you've restarted the app (Stop → Run)
- Verify API keys are correct (no extra spaces)
- Check Console for error messages

**Responses seem off:**
- Model may need different temperature/max_tokens settings
- Check that bot configuration (voxelbot-config-v1.json) is loading correctly
- Try a different model variant (e.g., kimi-latest instead of kimi-k2.5)

**Want to switch back to OpenAI:**
- Just change `AI_PROVIDER` back to `openai`
- Keep both API keys in secrets so you can switch anytime

---

## Technical Notes

### What Changed:
- `server/lib/openai.ts` - Now supports multiple providers
- Uses OpenAI-compatible API for Moonshot (same interface)
- Environment variables control provider selection
- No database or schema changes needed

### Files Modified:
- `/server/lib/openai.ts` - Added Moonshot client initialization
- `/.env.example` - Documentation for environment variables
- `/AI-MODEL-GUIDE.md` - This guide

---

## Questions?

Your Moonshot API key is already configured in this guide. Just add it to Replit Secrets and switch `AI_PROVIDER` to `moonshot`!

**Cost tracking**: Check your usage at https://platform.moonshot.ai (for Moonshot) or https://platform.openai.com (for OpenAI)
