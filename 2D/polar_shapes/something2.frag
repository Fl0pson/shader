#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
#define FLT_MIN 1.175494351e-38
vec2 rotate(vec2 point, float angle) {
    float sin_val = sin(angle);
    float cos_val = cos(angle);
    return vec2(cos_val * point.x - sin_val * point.y, sin_val * point.x + cos_val * point.y);
}
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv -= vec2(0.5);
    float theta = atan(uv.y, uv.x);
    uv += vec2(0.5);
    float rotation_speed = 5.0;
    vec2 rotated_point = rotate(uv, sin(uv.y * (-u_time) * PI * rotation_speed) + cos(uv.x + (-u_time) * PI / rotation_speed));
    float radius = rotated_point.y * sin(theta * u_time * PI + uv.x) + rotated_point.x * sin(theta * u_time * PI + uv.x);
    vec3 color = vec3(radius);
    gl_FragColor = vec4(color, 1.0);
}
