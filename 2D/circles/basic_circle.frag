#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
float drawCircle(vec2 start_point, vec2 uv, float base_size, float thickness, float sharpness)
{
    vec2 center = uv - start_point;
    float len = length(center);
    float dist = abs(len - base_size);
    float aa = 1.0 / sharpness;
    float mask = smoothstep(thickness + aa, thickness - aa, dist);
    return mask;
}
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse_position = u_mouse / u_resolution;

    float circle = drawCircle(vec2(0.5), uv, 0.1, 0.3, 5.0);
    float circle2 = drawCircle(vec2(0.5), uv, 0.02, 0.05, 10000.0);

    vec3 color = vec3(1.0) * circle;
    vec3 color2 = vec3(1.0, 0.0, 0.0) * circle2;
    color = mix(color, color2, 0.5);
    gl_FragColor = vec4(color, 1.0);
}
