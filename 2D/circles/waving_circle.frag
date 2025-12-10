#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14

vec2 rotate(vec2 point, float angle) {
    float sin_val = sin(angle);
    float cos_val = cos(angle);
    return vec2(cos_val * point.x - sin_val * point.y, sin_val * point.x + cos_val * point.y);
}
float adjust_for_mouse(float val, vec2 mouse_position) {
    return val * mouse_position.x + val * mouse_position.y;
}

float wave(float ampl, float angle, float frequence, float offset) {
    return ampl * sin(angle * frequence + u_time * PI);
}

float drawCircle(vec2 start_point, vec2 uv, float base_size, float thickness)
{
    float angle = atan(uv.y, uv.x);
    float wave_val = wave(0.5, angle, 12.0, 0.0);
    float dist = distance(start_point, uv) + wave_val;
    float minR = min(base_size, thickness);
    float maxR = max(base_size, thickness);
    return (dist > minR && dist < maxR) ? 1.0 : 0.0;
}
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse_position = u_mouse / u_resolution;
    vec3 color = vec3(1.0, 0.0, 0.0);
    vec3 color2 = vec3(0.0, 0.0, 1.0);
    vec3 color3 = vec3(0.0, 1.0, 0.0);
    vec3 color4 = vec3(0.0, 1.0, 1.0);

    float ring = drawCircle(vec2(0.5), uv, 0.2, 0.31);
    float line2 = drawCircle(vec2(0.6, 0.3), uv, 0.2, 0.3);
    float line3 = drawCircle(vec2(0.5, 0.7), uv, 0.6, 0.7);
    float line4 = drawCircle(vec2(0.3, 0.45), uv, 0.4, 0.5);

    vec3 mixed = vec3(0.0);
    mixed = mix(mixed, color, ring);
    mixed = mix(mixed, color2, line2);
    mixed = mix(mixed, color3, line3);
    mixed = mix(mixed, color4, line4);
    gl_FragColor = vec4(mixed, 1.0);
}
