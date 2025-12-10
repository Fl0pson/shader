#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14

vec3 color_palette(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(2.0 * PI * (c * t + d));
}
void main() {
    vec3 ampl = vec3(0.9);
    vec3 bias = vec3(0.5);
    vec3 frequence = vec3(0.5);
    vec3 color = vec3(1.0);
    vec3 offset = vec3(0.0, 0.33, 0.67);
    vec3 palette = color_palette(ampl, bias, color, offset, u_time);

    vec3 palette2 = color_palette(ampl * 1.5, bias, vec3(1.0, 0.0, 0.0), vec3(0.5), u_time);
    vec3 mixed_color = mix(palette, palette2, cos(u_time));
    gl_FragColor = vec4(mixed_color, 1.0);
}
