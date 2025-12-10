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
    float sin_val = random2d(point) + sin(angle);
    float cos_val = cos(angle);
    return vec2(cos_val * point.x - sin_val * point.y, sin_val * point.x + cos_val * point.y);
}

float drawCircle(vec2 start_point, vec2 uv, float innerRadius, float outerRadius)
{
    uv -= start_point;
    vec2 rotated_point = rotate(uv, (u_time * PI));
    uv += start_point;
    float dist = distance(start_point, rotated_point);
    float circle_point = (dist > innerRadius && dist < outerRadius) ? 1.0 : 0.0;
    return circle_point;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse_position = u_mouse / u_resolution;
    vec3 color = vec3(1.0, 0.0, 0.0);
    vec3 color2 = vec3(0.0, 0.0, 1.0);
    vec3 color3 = vec3(0.0, 1.0, 0.0);
    vec3 color4 = vec3(0.0, 1.0, 1.0);

    float line1 = drawCircle(vec2(0.25, 0.25), uv, 0.1, 0.5);
    float line2 = drawCircle(vec2(0.1, 0.3), uv, 0.2, 0.3);
    float line3 = drawCircle(vec2(0.5, 0.7), uv, 0.3, 0.4);
    float line4 = drawCircle(vec2(0.1, 0.15), uv, 0.4, 0.5);

    vec3 mixed = vec3(0.0);
    mixed = mix(mixed, color, line1);
    mixed = mix(mixed, color2, line2);
    mixed = mix(mixed, color3, line3);
    mixed = mix(mixed, color4, line4);
    gl_FragColor = vec4(mixed, 1.0);
}
