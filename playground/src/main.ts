import { render } from 'vue/vapor'

const modules = import.meta.glob<any>('./*.(vue|js)')
const mod = (modules['.' + location.pathname] || modules['./App.vue'])()

mod.then(({ default: mod }) => render(mod, {}, '#app'))
