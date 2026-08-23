import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement object URLs; stub them for image-preview rendering.
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock'
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
