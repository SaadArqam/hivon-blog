# Rate Limiting Implementation

## Overview
Added comprehensive rate limiting to prevent Supabase email rate limits and protect against abuse.

## Features Implemented

### 1. Client-Side Rate Limiting
- **Registration**: 3 attempts per 15 minutes, 30-minute block
- **Login**: 5 attempts per 5 minutes, 15-minute block
- **Password Reset**: 3 attempts per hour, 1-hour block

### 2. Visual Feedback
- Real-time rate limit status display
- Remaining attempts counter
- Countdown timer for blocked users
- Disabled form elements when rate limited

### 3. Server-Side Protection
- API-level rate limiting for registration
- Duplicate protection (client + server)
- Proper HTTP 429 status codes

## Implementation Details

### Rate Limiter Class (`lib/rateLimiter.ts`)
```typescript
class RateLimiter {
  constructor(maxAttempts, windowMs, blockDurationMs)
  isAllowed(identifier): { allowed, retryAfter?, remainingAttempts? }
  recordAttempt(identifier): void
  reset(identifier): void
}
```

### Registration Page (`app/(auth)/register/page.tsx`)
- Real-time email rate limit checking
- Visual warnings and countdown
- Button disabled when rate limited
- Attempts remaining indicator

### Login Page (`app/(auth)/login/page.tsx`)
- Login attempt rate limiting
- Visual feedback for blocked attempts
- Prevents brute force attacks

### API Protection (`app/api/register/route.ts`)
- Server-side rate limit validation
- HTTP 429 responses with retry information
- Prevents client bypass attempts

## Rate Limit Configuration

### Email Registration (Most Restrictive)
- **Max Attempts**: 3 per 15 minutes
- **Block Duration**: 30 minutes
- **Rationale**: Prevents Supabase email service rate limits

### Login Attempts (Medium Restriction)
- **Max Attempts**: 5 per 5 minutes  
- **Block Duration**: 15 minutes
- **Rationale**: Prevents brute force attacks

### Password Reset (Most Restrictive)
- **Max Attempts**: 3 per hour
- **Block Duration**: 1 hour
- **Rationale**: Prevents email bombing

## User Experience

### Normal State
- Green/amber indicators showing remaining attempts
- Full functionality available

### Warning State
- Amber background with attempts remaining
- User informed of approaching limits

### Blocked State
- Red border and background
- Clear countdown timer
- Submit button disabled
- Helpful error messages

## Technical Benefits

### 1. Prevents Service Rate Limits
- Stops Supabase 429 errors before they happen
- Better user experience than service errors
- Configurable limits per service

### 2. Security Improvements
- Prevents brute force attacks
- Stops automated registration abuse
- Reduces server load

### 3. User Experience
- Clear feedback about limits
- Countdown timers instead of vague errors
- Graceful degradation

## Testing the Rate Limiter

### 1. Registration Testing
1. Go to `/register`
2. Enter email and attempt registration 3+ times
3. Observe rate limit activation
4. Try different emails (should be separately tracked)

### 2. Login Testing  
1. Go to `/login`
2. Enter email and attempt login 5+ times
3. Observe rate limit activation
4. Wait for reset and test again

### 3. API Testing
```bash
# Test server-side rate limiting
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"id":"test","name":"Test","email":"test@example.com","role":"viewer"}'
```

## Configuration Options

### Custom Rate Limits
```typescript
// Create custom rate limiter
const customLimiter = new RateLimiter(
  10,        // max attempts
  60 * 1000, // window (1 minute)
  5 * 60 * 1000 // block duration (5 minutes)
)
```

### Environment-Specific Limits
```typescript
// Different limits for development vs production
const maxAttempts = process.env.NODE_ENV === 'development' ? 10 : 3
const windowMs = process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000
```

## Monitoring and Analytics

### Rate Limit Events
- Client-side: Console logs for rate limit hits
- Server-side: HTTP 429 responses logged
- Future: Analytics dashboard for rate limit metrics

### Performance Impact
- Minimal overhead (in-memory Map storage)
- No external dependencies
- Fast lookups and updates

## Security Considerations

### 1. Client-Side Bypass
- Server-side validation prevents bypass
- Rate limits tracked by email/IP
- Multiple layers of protection

### 2. Memory Management
- Automatic cleanup of old entries
- Bounded memory usage
- No persistence (resets on restart)

### 3. Privacy
- No personal data stored beyond limits
- Temporary in-memory storage only
- GDPR compliant

## Future Enhancements

### 1. Persistent Storage
- Redis for distributed rate limiting
- Database persistence
- Cross-server synchronization

### 2. Advanced Rules
- IP-based rate limiting
- Geographic restrictions
- Time-based rules (business hours)

### 3. User Interface
- Rate limit dashboard for admins
- User notification system
- Customizable limit rules

## Troubleshooting

### Common Issues
1. **Rate limits too strict**: Adjust maxAttempts or windowMs
2. **Limits not working**: Check imports and initialization
3. **Server crashes**: Ensure proper error handling

### Debug Mode
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development'
if (DEBUG) console.log('Rate limit check:', identifier, result)
```

This implementation provides robust protection against rate limiting issues while maintaining excellent user experience.
