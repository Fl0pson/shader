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

float drawCircle(vec2 start_point, vec2 uv, float base_size, float thickness, float rotation_speed, float sections)
{
    float angle = atan(uv.y - start_point.y, uv.x - start_point.x);
    float wave = tan(angle * PI * sections + u_time * rotation_speed) * 0.001;
    float dist = distance(start_point, uv);
    float minR = min(base_size, thickness) + wave;
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

    float ring = drawCircle(vec2(0.5), uv, 0.5, 0.6, 6.0, 12.0);
    float line2 = drawCircle(vec2(0.1, 0.3), uv, 0.2, 0.3, 1.0, 2.0);
    float line3 = drawCircle(vec2(0.5, 0.7), uv, 0.3, 0.4, 2.5, 3.0);
    float line4 = drawCircle(vec2(0.1, 0.15), uv, 0.4, 0.5, 36.0, 4.5);

    vec3 mixed = vec3(0.0);
    mixed = mix(mixed, color, ring);
    mixed = mix(mixed, color2, line2);
    mixed = mix(mixed, color3, line3);
    mixed = mix(mixed, color4, line4);
    gl_FragColor = vec4(mixed, 1.0);
}
