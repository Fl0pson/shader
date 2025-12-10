#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
#define TWOPI 2.0 * PI

vec2 rotate(vec2 point, float angle) {
    float sin_val = sin(angle);
    float cos_val = cos(angle);
    return vec2(cos_val * point.x - sin_val * point.y, sin_val * point.x + cos_val * point.y);
}
float sin_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}
float cos_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
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
    uv += vec2(0.5);
    float theta = atan(uv.y, uv.x);
    uv -= vec2(0.5);

    vec2 rotated_point = rotate(uv, theta);
    float wave = sin_wave(2.0, length(rotated_point) + length(uv), 5.2, 1.0) + cos_wave(2.0, theta, 2.2, 0.2);
    float model_wave = 5.0 * cos(theta * (u_time) * PI + wave + uv.x * uv.y);
    vec4 color = vec4(1.0);
    vec4 wave_color = vec4(0.0, 1.0, 0.0, 0.5);

    float wave2 = cos_wave(2.0, atan(rotated_point.y, rotated_point.x), 1.2, -.5);
    vec4 wave2_color = vec4(0.0, 0.0, 0.9, 0.75);

    float wave3 = cos_wave(0.5, u_time + atan(rotated_point.y, rotated_point.x), 12.0, 0.5) + sin_wave(0.1, u_time + atan(uv.x, uv.y), 4.0, 1.5);
    ;
    vec4 wave3_color = vec4(1.0, 0.0, 1.0, .5);
    color = mix(color, wave_color, wave);
    color = mix(color, wave2_color, wave2);
    color = mix(color, wave3_color, wave3);
    // gl_FragColor = vec4(color);
    gl_FragColor = vec4(fract(color));
}
