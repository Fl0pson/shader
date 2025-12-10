#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
vec3 color_palette(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(2.0 * 3.14 * (c * t + d));
}

float draw_rectangle(vec2 pos, vec2 size) {
    vec2 bot_left = step(size, pos);
    vec2 top_right = step(vec2(0.5 - size), 1.0 - pos);
    return bot_left.x * bot_left.y * top_right.x * top_right.y;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec3 ampl = vec3(0.9);
    vec3 bias = vec3(0.5);
    vec3 offset = vec3(0.0, 0.33, 0.67);
    vec3 palette = color_palette(ampl, bias, vec3(sin(u_time * 3.14)), offset, 0.4);
    vec3 palette2 = color_palette(ampl, bias, vec3(sin(u_time * 3.14)), vec3(0.5, 0.6, 0.1), 0.8);
    float rect = draw_rectangle(uv, vec2(0.15, 0.5));
    float rect2 = draw_rectangle(uv, vec2(0.33, 0.1));

    vec3 color = vec3(0.5);
    color = mix(color, palette, rect);
    vec3 color2 = vec3(.25);
    color2 = mix(color2, palette2, rect2);
    color = mix(color, color2, 0.5);
    gl_FragColor = vec4(color, 1.0);
}
