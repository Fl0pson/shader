#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
#define PI 3.14
#define TWOPI 2.0 * PI
vec2 rotate(vec2 point, float angle) {
    point -= vec2(0.5);
    point = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * point;
    point += vec2(0.5);
    return point;
}

float smoothBox(vec2 pos, vec2 size, float smoothness) {
    size = vec2(0.5) - size * 0.5;
    vec2 uv = smoothstep(size, size + vec2(smoothness), pos);
    uv *= smoothstep(size, size + vec2(smoothness), vec2(1.0) - pos);
    return uv.x * uv.y;
}

float sin_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}
float cos_wave(float ampl, float angle, float frequence, float speed) {
    return ampl * sin(angle * frequence + u_time * PI * speed);
}

vec2 rotatePointPattern(vec2 point, float index) {
    float direction = mod(index, 2.0) == 0.0 ? 1.0 : -1.0;
    point = rotate(point, u_time);
    return point;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 tile_count = vec2(12.0, 12.0);
    vec2 scaled_uv = uv * tile_count;
    vec2 tile_id = vec2(floor(scaled_uv));
    vec2 local_point = fract(scaled_uv);
    float index = tile_id.y * tile_count.x + tile_id.x;

    scaled_uv = rotatePointPattern(fract(scaled_uv), index);
    float rect = smoothBox(scaled_uv, vec2(1.0), 0.01);

    float theta = atan(scaled_uv.y, scaled_uv.x);
    float wave = sin_wave(0.5, theta, 0.5, 0.5);

    vec4 color = vec4(1.0);
    vec4 wave_color = vec4(0.75, 0.5, 0.75, 0.5);

    float wave2 = sin_wave(2.0, length(scaled_uv) + length(uv), 5.2, 1.0) + cos_wave(2.0, theta, 2.2, 0.2);
    //   float model_wave = 5.0 * cos(theta * PI + wave2);
    float model_wave = 5.0 * cos(theta * PI + wave2);
    vec4 wave_color2 = vec4(0.0, sin(index) * u_time, cos(index) * u_time, 0.5);

    color = mix(color, wave_color, smoothstep(0.0, 1.0, sin(wave * PI) + cos(wave * PI)));
    color = mix(color, wave_color2, theta);
    gl_FragColor = vec4(color * rect * model_wave);
}
