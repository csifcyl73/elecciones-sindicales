import os

MIDDLEWARE_PATH = '../src/middleware.ts'

INJECTION = """
// --------------------------------------------------------------------------------
// FASE 3: Edge Rate Limiting Distribuido (@upstash/ratelimit) - FALLBACK EN MEMORIA
// --------------------------------------------------------------------------------
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Instanciar limitador (con fallback condicional por si no hay env vars configuradas en entorno local)
let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  }
} catch (e) {
  console.warn("Upstash RateLimit inactivo: Faltan variables de entorno.");
}
"""

def update_middleware():
    if not os.path.exists(MIDDLEWARE_PATH):
        print(f"Error: {MIDDLEWARE_PATH} not found.")
        return
        
    with open(MIDDLEWARE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "Upstash" in content or "@upstash/ratelimit" in content:
        print("Upstash logic already injected into middleware.ts.")
        return
        
    # Replace the memory fallback text injection point
    injection_point = "const rateLimitMap"
    if injection_point not in content:
        print("Could not find memory rate limit map in middleware to patch.")
        return
        
    new_content = content.replace(injection_point, INJECTION.strip() + "\\n\\n" + injection_point)
    
    # Inject Ratelimit runtime Logic
    logic_point = "if (!checkRateLimit(ip)) {"
    
    upstash_logic = """
    // Fase 3 - Comprobación Edge (Fallback silencioso a memo)
    if (ratelimit) {
      const { success } = await ratelimit.limit(ip);
      if (!success) return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      if (!checkRateLimit(ip)) {
        return new NextResponse('Too Many Requests Locally', { status: 429 });
      }
    }
"""
    new_content = new_content.replace(
        "if (!checkRateLimit(ip)) {\n      return new NextResponse('Too Many Requests', { status: 429 });\n    }", 
        upstash_logic.strip()
    )

    with open(MIDDLEWARE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("middleware.ts updated with Phase 3 Distributed Edge Limiter support.")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    update_middleware()
