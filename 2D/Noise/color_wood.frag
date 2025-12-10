#version 330 core

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14159265359

float hash(vec3 p3) {
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

float hash(float seedX, float seedY, float seedZ) {
    return hash(vec3(seedX, seedY, seedZ));
}

float hash(vec2 seed) {
    return hash(vec3(seed.x, seed.y, fract(seed.x + seed.y)));
}
vec3 hash3(vec3 p3) {
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}
vec3 hash3(float seedX, float seedY, float seedZ) {
    return hash3(vec3(seedX, seedY, seedZ));
}

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float noise(vec2 seed) {
    vec2 i = floor(seed);
    float v00 = hash(i);
    float v10 = hash(i + vec2(1.0, 0.0));
    float v01 = hash(i + vec2(0.0, 1.0));
    float v11 = hash(i + vec2(1.0, 1.0));
    vec2 f = fract(seed);

    vec2 weight = smoothstep(0.0, 1.0, f);

    float x1 = mix(v00, v10, weight.x);
    float x2 = mix(v01, v11, weight.x);
    return mix(x1, x2, weight.y);
}

float get_lines(float value) {
    return sin(value) + 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv *= vec2(5.0, 10.0);
    uv = rotate(noise(uv)) * uv;

    float lines = get_lines(30.0 * uv.y);
    vec4 color = vec4(1.0, 0.0, 0.5, 1.0);
    vec4 color2 = vec4(.60, 1.0, 0.3, 1.0);
    color = mix(color, color2, lines);
    gl_FragColor = color;
}
