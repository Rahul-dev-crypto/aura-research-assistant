# Gemini API Key Rotation System

## Overview
This system automatically rotates through multiple Gemini API keys to avoid rate limits. When one key hits its quota, it automatically switches to the next key.

## Setup

### 1. Get Multiple API Keys
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create multiple API keys (you can create as many as you need)
3. Each key has its own rate limit: 15 requests/minute, 1,500 requests/day

### 2. Add Keys to .env.local
Open your `.env.local` file and add all your keys separated by commas (no spaces):

```env
GEMINI_API_KEYS=AIzaSyAbc123...,AIzaSyDef456...,AIzaSyGhi789...,AIzaSyJkl012...
```

Example with 4 keys:
```env
GEMINI_API_KEYS=AIzaSyAm92PTiRMlld3JoijDEsiwYlKy-lCtlG0,AIzaSyBnXYZ123456789,AIzaSyCdEFG987654321,AIzaSyDhIJK246813579
```

### 3. Restart Your Server
After adding keys, restart your development server:
```bash
npm run dev
```

## How It Works

### Automatic Rotation
- The system tracks usage for each key
- When a key approaches its rate limit (14 requests/minute), it automatically switches to the next key
- If a key returns a rate limit error, it's marked as exhausted and the next key is used immediately
- After all keys are used, it loops back to the first key

### Smart Rate Limiting
- Each key can handle 14 requests per minute (conservative limit)
- Usage counters reset after 1 minute
- The system logs which key is being used in the console

### Error Handling
- If one key fails due to rate limits, it tries the next key automatically
- If all keys are exhausted, you'll get a clear error message
- Non-rate-limit errors (like invalid keys) don't trigger rotation

## Console Logs
You'll see logs like this:
```
Loaded 4 API key(s) for rotation
Using API key: AIzaSyAm92...lG0 (Usage: 1/14)
Generating content with Gemini 2.5 Flash (Key 1/4)...
Content generated successfully
```

When rate limit is hit:
```
Rate limit hit, trying next API key...
Using API key: AIzaSyBnXY...321 (Usage: 1/14)
Generating content with Gemini 2.5 Flash (Key 2/4)...
```

## Benefits

### With 1 Key
- 15 requests/minute
- 1,500 requests/day

### With 4 Keys
- 60 requests/minute (4 × 15)
- 6,000 requests/day (4 × 1,500)

### With 10 Keys
- 150 requests/minute (10 × 15)
- 15,000 requests/day (10 × 1,500)

## Tips

1. **Create Multiple Keys**: You can create as many free API keys as you need from Google AI Studio
2. **Monitor Usage**: Check the console logs to see which keys are being used
3. **Add More Keys Anytime**: Just add them to GEMINI_API_KEYS and restart the server
4. **Keep Keys Secure**: Never commit your .env.local file to version control

## Troubleshooting

### "All API keys have exceeded their quota"
- All your keys have hit their rate limits
- Wait 1 minute for rate limits to reset, or 24 hours for daily limits
- Consider adding more API keys

### "Invalid API key"
- One or more keys in your list is invalid
- Check that all keys are correct and active
- Remove any invalid keys from GEMINI_API_KEYS

### Keys not rotating
- Make sure keys are separated by commas with no spaces
- Restart your development server after changing .env.local
- Check console logs to see if keys are being loaded correctly
