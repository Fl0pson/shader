#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
float random2d(vec2 coord) {
    return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
vec2 rotate(vec2 point, float angle) {
    float sin_val = sin(angle);
    float cos_val = cos(angle);
    return vec2(cos_val * point.x - sin_val * point.y, sin_val * point.x + cos_val * point.y);
}
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse_position = u_mouse / u_resolution;
    vec2 start = uv - vec2(0.5);
    start = rotate(start, u_time);
    float angle = atan(start.y, start.x);
    float f = cos(angle * 3.14);
    float radius = length(start) * 2.0;
    vec3 color = vec3(1.0 - smoothstep(f, f + 0.05, radius));
    gl_FragColor = vec4(color, 1.0);
}
