import { Color, ColorRepresentation, DoubleSide, ShaderMaterial, Side, Vector3 } from 'three';

// import fragment from './stroke.frag';
// import vertex from './stroke.vert';

const fragment = `
uniform vec3 diffuse;
uniform float opacity;
uniform vec3 dash; 
uniform vec3 trim; 
varying vec2 lineU; 

#ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
#endif

float aastep(float threshold, float value) {
#if !defined(GL_ES) || __VERSION__ >= 300 || defined(GL_OES_standard_derivatives)
  float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
  return smoothstep(threshold-afwidth, threshold+afwidth, value);
#elif defined(AA_EDGE)
  float afwidth = AA_EDGE;
  return smoothstep(threshold-afwidth, threshold+afwidth, value);
#else 
  return step(threshold, value);
#endif
}

#define ALPHA_TEST 2.0 / 255.0

void main() {
  float opacityMod = 1.0;
  float offset = trim.z;
  
  
  if(dash.x > 0.0 && dash.y > 0.0) {
    offset = (dash.z * 0.5) - (trim.z * lineU.y);
    float dashEnd = dash.x + dash.y;
    float lineUMod = mod(lineU.x + offset, dashEnd);
    opacityMod = aastep(lineUMod, dash.x);
  }
  
  
  if(trim.x > 0.0 || trim.y < 1.0) {
    offset = trim.z;
    float per = lineU.x / lineU.y;
    float start = min(trim.x, trim.y) + offset;
    float end = max(trim.x, trim.y) + offset;

    if(start == end) {
      opacityMod = 0.0;
    } else if(end > 1.0) {
      if(per > end - 1.0 && per < start) {
        opacityMod = 0.0;
      }
    } else if(start < 0.0) {
      if(per > end && per < start + 1.0) {
        opacityMod = 0.0;
      }
    } else if(per < start || per > end) {
      opacityMod = 0.0;
    }
  }

  opacityMod *= opacity;
  if(opacityMod < ALPHA_TEST) discard;

  gl_FragColor = vec4(diffuse, opacityMod);
}
`;
const vertex = `
uniform float thickness;
attribute float lineMiter;
attribute vec2 lineNormal;
attribute vec2 lineDistance; 
varying vec2 lineU;

void main() {
  lineU = lineDistance;
  vec3 pointPos = position.xyz + vec3(lineNormal * thickness/2.0 * lineMiter, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pointPos, 1.0 );
}
`;
type StrokeProps = {
	diffuse?: ColorRepresentation;
	thickness?: number;
	opacity?: number;
	dash?: number;
	dashGap?: number;
	dashOffset?: number;
	trimStart?: number;
	trimEnd?: number;
	trimOffset?: number;
	side?: Side | undefined;
};

export default class StrokeMaterial extends ShaderMaterial {
	constructor(params?: StrokeProps) {
		super({
			uniforms: {
				thickness: {
					value: params?.thickness !== undefined ? params?.thickness : 4.0
				},
				opacity: {
					value: params?.opacity !== undefined ? params?.opacity : 1.0
				},
				diffuse: {
					value: new Color(params?.diffuse !== undefined ? params?.diffuse : 0xffffff)
				},
				dash: {
					value: new Vector3(
						params?.dash !== undefined ? params?.dash : 0,
						params?.dashGap !== undefined ? params?.dashGap : 10,
						params?.dashOffset !== undefined ? params?.dashOffset : 0
					)
				},
				trim: {
					value: new Vector3(
						params?.trimStart !== undefined ? params?.trimStart : 0,
						params?.trimEnd !== undefined ? params?.trimEnd : 1,
						params?.trimOffset !== undefined ? params?.trimOffset : 0
					)
				}
			},
			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
			side: params?.side !== undefined ? params?.side : DoubleSide,
			// @ts-ignore
			name: 'StrokeMaterial'
		});
	}

	get thickness(): number {
		return this.uniforms.thickness.value;
	}

	set thickness(value: number) {
		this.uniforms.thickness.value = value;
	}

	get alpha(): number {
		return this.uniforms.opacity.value;
	}

	set alpha(value: number) {
		this.uniforms.opacity.value = value;
	}

	get diffuse(): Color {
		return this.uniforms.diffuse.value;
	}

	set diffuse(value: Color) {
		this.uniforms.diffuse.value = value;
	}

	get dash(): number {
		return this.uniforms.dash.value.x;
	}

	set dash(value: number) {
		this.uniforms.dash.value.x = value;
	}

	get dashGap(): number {
		return this.uniforms.dash.value.y;
	}

	set dashGap(value: number) {
		this.uniforms.dash.value.y = value;
	}

	get dashOffset(): number {
		return this.uniforms.dash.value.z;
	}

	set dashOffset(value: number) {
		this.uniforms.dash.value.z = value;
	}

	get trimStart(): number {
		return this.uniforms.trim.value.x;
	}

	set trimStart(value: number) {
		this.uniforms.trim.value.x = value;
	}

	get trimEnd(): number {
		return this.uniforms.trim.value.y;
	}

	set trimEnd(value: number) {
		this.uniforms.trim.value.y = value;
	}

	get trimOffset(): number {
		return this.uniforms.trim.value.z;
	}

	set trimOffset(value: number) {
		this.uniforms.trim.value.z = value;
	}
}
