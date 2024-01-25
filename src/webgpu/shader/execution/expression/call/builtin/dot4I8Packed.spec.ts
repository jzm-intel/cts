export const description = `
Execution tests for the 'dot4I8Packed' builtin function

@const fn dot4I8Packed(e1: u32 ,e2: u32) -> i32
e1 and e2 are interpreted as vectors with four 8-bit signed integer components. Return the signed
integer dot product of these two vectors. Each component is sign-extended to i32 before performing
the multiply, and then the add operations are done in WGSL i32 with wrapping behaviour.
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../../gpu_test.js';
import { TypeI32, TypeU32, i32, u32 } from '../../../../../util/conversion.js';
import { Case } from '../../case.js';
import { allInputSources, Config, run } from '../../expression.js';

import { builtin } from './builtin.js';

export const g = makeTestGroup(GPUTest);

g.test('basic')
  .specURL('https://www.w3.org/TR/WGSL/#dot4I8Packed-builtin')
  .desc(
    `
@const fn dot4I8Packed(e1: u32, e2: u32) -> i32
  `
  )
  .params(u => u.combine('inputSource', allInputSources))
  .fn(async t => {
    const cfg: Config = t.params;

    const dot4I8Packed = (e1: number, e2: number) => {
      let result = 0;
      for (let i = 0; i < 4; ++i) {
        let e1_i = (e1 >> (i * 8)) & 0xff;
        if (e1_i >= 128) {
          e1_i -= 256;
        }
        let e2_i = (e2 >> (i * 8)) & 0xff;
        if (e2_i >= 128) {
          e2_i -= 256;
        }
        result += e1_i * e2_i;
      }
      return result;
    };

    const testInputs = [
      // dot({0, 0, 0, 0}, {0, 0, 0, 0})
      [0, 0],
      // dot({127, 127, 127, 127}, {127, 127, 127, 127})
      [0x7f7f7f7f, 0x7f7f7f7f],
      // dot({-128, -128, -128, -128}, {-128, -128, -128, -128})
      [0x80808080, 0x80808080],
      // dot({127, 127, 127, 127}, {-128, -128, -128, -128})
      [0x7f7f7f7f, 0x80808080],
      // dot({1, 2, 3, 4}, {5, 6, 7, 8})
      [0x01020304, 0x05060708],
      // dot({1, 2, 3, 4}, {-1, -2, -3, -4})
      [0x01020304, 0xfffefdfc],
      // dot({-5, -6, -7, -8}, {5, 6, 7, 8})
      [0xfbfaf9f8, 0x05060708],
      // dot({-9, -10, -11, -12}, {-13, -14, -15, -16})
      [0xf7f6f5f4, 0xf3f2f1f0],
    ] as const;

    const makeCase = (x: number, y: number): Case => {
      return { input: [u32(x), u32(y)], expected: i32(dot4I8Packed(x, y)) };
    };
    const cases: Array<Case> = testInputs.flatMap(v => {
      return [makeCase(...(v as [number, number]))];
    });

    await run(t, builtin('dot4I8Packed'), [TypeU32, TypeU32], TypeI32, cfg, cases);
  });