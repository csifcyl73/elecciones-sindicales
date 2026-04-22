import os

MIDDLEWARE_PATH = '../src/middleware.ts'

RATE_LIMITER_CODE = """// Rate Limiter simple en memoria (Fase 2 Auditoría)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 100; // max requests per minute
const WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (now - record.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}

"""

def update_middleware():
    if not os.path.exists(MIDDLEWARE_PATH):
        print(f"Error: {MIDDLEWARE_PATH} not found.")
        return
        
    with open(MIDDLEWARE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "rateLimitMap" in content:
        print("Rate Limiter is already injected into middleware.ts.")
        return

    # To be safer, just prepend to the file, and then inject into function
    part1_injection = RATE_LIMITER_CODE
    
    injection_point = "export async function middleware(request: NextRequest) {"
    
    rate_limit_injection = """
  // Fase 2 - Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/admin/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
"""
    
    if injection_point not in content:
       print("Could not find middleware function export.")
       return
       
    content = content.replace(injection_point, injection_point + rate_limit_injection)
    new_content = part1_injection + content
    
    with open(MIDDLEWARE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("middleware.ts updated with Phase 2 Rate Limiter.")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    update_middleware()
