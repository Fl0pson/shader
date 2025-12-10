#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14

float adjust_for_mouse(float val, vec2 mouse_position) {
    return val * mouse_position.x + val * mouse_position.y;
}

float sin_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}
float cos_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}
float drawCircle(vec2 start_point, vec2 uv, float base_size, float thickness)
{
    vec2 center = uv - start_point;
    float angle = atan(center.y, center.x);
    float wave_val = sin_wave(0.1, angle, 44.0, .5) + cos_wave(0.1, angle, 12.0, 0.5);
    float radius = base_size + wave_val;
    float len = length(center);
    float dist = abs(len - radius);
    float mask = smoothstep(thickness + 0.01, thickness - 0.01, dist);
    return mask;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse_position = u_mouse / u_resolution;
    vec3 color = vec3(1.0, 0.0, 0.0);
    vec3 color2 = vec3(0.0, 0.0, 1.0);
    vec3 color3 = vec3(0.0, 1.0, 0.0);
    vec3 color4 = vec3(0.0, 1.0, 1.0);

    float ring = drawCircle(vec2(0.5), uv, 0.1, 0.11);
    float line2 = drawCircle(vec2(0.6, 0.3), uv, 0.2, 0.3);
    float line3 = drawCircle(vec2(0.5, 0.7), uv, 0.6, 0.7);
    float line4 = drawCircle(vec2(0.3, 0.45), uv, 0.4, 0.5);

    vec3 mixed = vec3(0.0);
    mixed = mix(mixed, color, ring);
      // mixed = mix(mixed, color2, line2);
    // mixed = mix(mixed, color3, line3);
    // mixed = mix(mixed, color4, line4);
    gl_FragColor = vec4(mixed, 1.0);
}
