import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import pkg from './package.json';

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        output: [
            {
                name: pkg.name,
                file: pkg.browser,
                format: 'umd',
            },
            {
                name: pkg.name,
                file: `dist/umd/${pkg.name}.umd.min.js`,
                format: 'umd',
                plugins: [terser()],
            },
        ],
        plugins: [
            peerDepsExternal(),
            resolve({ browser: true, preferBuiltins: false }),
            commonjs(),
            ts({
                hook: {
                    // Always rename declaration files to index.d.ts to avoid emitting two declaration files with identical contents
                    outputPath: (path, kind) => (kind === 'declaration' ? './dist/index.d.ts' : path),
                },
            }),
        ],
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'named' },
            { file: pkg.module, format: 'es', sourcemap: true, exports: 'named' },
        ],
        plugins: [peerDepsExternal(), resolve({ browser: true, preferBuiltins: false }), commonjs(), ts({ tsconfig: './tsconfig.json' })],
    },
];
