import {WebGL} from './webgl-types';
import {assertWebGLRenderingContext} from './webgl-checks';
import Framebuffer from './framebuffer';
import Renderbuffer from './renderbuffer';
import {Texture2D} from './texture';
import assert from 'assert';

export default class FramebufferObject {

  /* eslint-disable max-statements */
  constructor(gl, {
    width = 1,
    height = 1,
    depth = true,
    minFilter = WebGL.NEAREST,
    magFilter = WebGL.NEAREST,
    format = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE
  } = {}) {
    assertWebGLRenderingContext(gl);

    this.gl = gl;
    this.depth = depth;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.format = format;
    this.type = type;

    this.resize(width, height);
  }

  resize(width, height) {
    assert(width >= 0 && height >= 0, 'Width and height need to be integers');
    if (width === this.width && height === this.height) {
      return;
    }

    const {gl} = this;

    // TODO - do we need to reallocate the framebuffer?
    const fb = new Framebuffer(gl);

    const colorBuffer = new Texture2D(gl, {
      minFilter: this.minFilter,
      magFilter: this.magFilter
    })
    // TODO - should be handled by Texture2D constructor?
    .setImageData({
      data: null,
      width,
      height,
      type: this.type,
      format: this.format
    });

    fb.attachTexture({
      attachment: WebGL.COLOR_ATTACHMENT0,
      texture: colorBuffer
    });

    if (this.colorBuffer) {
      this.colorBuffer.delete();
    }
    this.colorBuffer = colorBuffer;

    // Add a depth buffer if requested
    if (this.depth) {
      const depthBuffer = new Renderbuffer(gl).storage({
        internalFormat: WebGL.DEPTH_COMPONENT16,
        width,
        height
      });
      fb.attachRenderbuffer({
        attachment: WebGL.DEPTH_ATTACHMENT,
        renderbuffer: depthBuffer
      });

      if (this.depthBuffer) {
        this.depthBuffer.delete();
      }
      this.depthBuffer = depthBuffer;
    }

    // Checks that framebuffer was properly set up,
    // if not, throws an explanatory error
    fb.checkStatus();

    this.width = width;
    this.height = height;

    // Immediately dispose of old buffer
    if (this.fb) {
      this.fb.delete();
    }
    this.fb = fb;
  }
  /* eslint-enable max-statements */

  bind() {
    this.fb.bind();
  }

  unbind() {
    this.fb.unbind();
  }
}
