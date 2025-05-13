import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Nora from '@primeuix/themes/nora';
import {definePreset} from '@primeuix/themes';
import ToastService from 'primevue/toastservice';

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ToastService)

const tcoTheme = definePreset(Nora, {
    semantic: {
        formField: {
            paddingY: '0.4rem',
            width: '100%'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.500}',
                    inverseColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.600}'
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                },
                surface: {
                    0: '#ffffff',
                    50: '{zinc.50}',
                    100: '{zinc.100}',
                    200: '{zinc.200}',
                    300: '{zinc.300}',
                    400: '{zinc.400}',
                    500: '{zinc.500}',
                    600: '{zinc.600}',
                    700: '{zinc.700}',
                    800: '{zinc.800}',
                    900: '{zinc.900}',
                    950: '{zinc.950}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.500}',
                    inverseColor: '{zinc.950}',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.600}',
                    contrastColor: 'primary.0'
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                },
                surface: {
                    0: '#ffffff',
                    50: '{slate.50}',
                    100: '{slate.100}',
                    200: '{slate.200}',
                    300: '{slate.300}',
                    400: '{slate.400}',
                    500: '{slate.500}',
                    600: '{slate.600}',
                    700: '{slate.700}',
                    800: '{slate.800}',
                    900: '{slate.900}',
                    950: '{slate.950}'
                }
            }
        },
        primary: {
            50: '{amber.50}',
            100: '{amber.100}',
            200: '{amber.200}',
            300: '{amber.300}',
            400: '{amber.400}',
            500: '{amber.500}',
            600: '{amber.600}',
            700: '{amber.700}',
            800: '{amber.800}',
            900: '{amber.900}',
            950: '{amber.950}'
        }
    },
    components: {
        formField: {
            colorScheme: {
                dark: {
                    root: {
                        background: 'transparent'
                    }
                }
            }
        },
        tabs: {
            colorScheme: {
                dark: {
                    root: {
                        tablist: {
                            background: 'transparent',
                            border: {
                                width: 0
                            }
                        },
                        tab: {
                            padding: '0 0rem',
                            margin: '0.2rem 1.125rem',
                            border: {
                                width: 0
                            },
                            background: 'transparent',
                            color: '{primary.0}',
                            active: {
                                background: 'transparent',
                                color: '{primary.color}',
                            },
                            hover: {
                                background: 'transparent',
                                color: '{primary.color}',
                            }
                        }
                    }
                }
            }
        },

        menubar: {
            colorScheme: {
                light: {
                    root: {
                        background: '{surface.50}',
                        color: '{surface.700}',
                        borderRadius: '0.5rem'
                    },
                },
                dark: {
                    root: {
                        background: '{surface.900}',
                        color: '{surface.0}',
                        border: {
                            color: '{surface.900}',
                            radius: '0rem'
                        }
                    }
                }
            }
        },
        steps: {
            item: {
                label: {
                    size: '1.25rem',
                }
            }
        },
        button: {
            paddingY: '0.4rem',
        },
        card: {
            body: {
                padding: '2rem',
            },
            colorScheme: {
                light: {
                    root: {
                        background: '{surface.100}',
                        color: '{surface.800}',
                        borderRadius: '0.5rem'
                    },
                    subtitle: {
                        color: '{surface.500}'
                    }
                },
                dark: {
                    root: {
                        borderRadius: '1rem 1rem 0 0',
                        background: '{surface.800}',
                        color: '{surface.100}'
                    },
                    subtitle: {
                        color: '{surface.400}'
                    }
                }
            }
        },
        inputtext: {
            colorScheme: {
                dark: {
                    root: {
                        background: '{surface.900}',
                        color: '{surface.0}',
                    }
                    //paddingY: '1rem'
                }
            }
        },
        floatlabel: {
            colorScheme: {
                dark: {
                    root: {
                        color: '{surface.100}',
                        active: {
                            color: '{primary.color}',
                        }
                    }
                }
            }
        },
        iconfield: {
            colorScheme: {
                dark: {
                    root: {
                        iconColor: '{surface.100}',
                    }
                }
            }
        },
        stepper: {
            colorScheme: {
                light: {
                    steppannel: {
                        background: 'transparent',
                    }
                }
            }
        },
        checkbox: {
            colorScheme: {
                light: {
                    background: '{surface.0}',
                    hhoverBackground: '{surface.0}',
                    checkedBackground: '{surface.0}',
                    checkedHoverBackground: '{surface.0}',
                    iconColor: '{surface.0}',
                    iconCheckedColor: '{primary.color}',
                    iconCheckedHoverColor: '{primary.color}',
                    hoverBorderColor: '{primary.color}'
                },
                dark: {
                    root: {
                        background: '{surface.900}',
                        hoverBackground: '{surface.900}',
                        checkedBackground: '{surface.900}',
                        checkedHoverBackground: '{surface.900}',
                        iconColor: '{surface.100}',
                        iconCheckedColor: '{primary.color}',
                        iconCheckedHoverColor: '{primary.color}',
                        hoverBorderColor: '{primary.color}'
                    }
                }
            }
        },
        drawer: {
            dark: {
                root: {
                    background: '{surface.900}',
                    color: '{surface.100}',
                    headerPadding: '0.1rem 0 0 0',
                }
            }
        }
    }
});

app.use(PrimeVue, {
    theme: {
        preset: tcoTheme,
        options: {
            darkModeSelector: '.dark',
        }
    },
    ripple: true
});
app.mount('#app')
