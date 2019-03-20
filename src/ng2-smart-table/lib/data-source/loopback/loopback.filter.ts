export class LoopbackFilter {
    protected static FILTER = (value: string, search: string) => {
        return value.toString().toLowerCase().includes(search.toString().toLowerCase());
    }

    static filter(data: any[], field: string, search: string, customFilter?: Function): any[] {
        const filter: Function = customFilter ? customFilter : this.FILTER;

        return data.filter((el) => {
            const parts = field.split('.');
            let prop = el;
            for (let i = 0; i < parts.length && typeof prop !== 'undefined'; i++) {
                prop = prop[parts[i]];
            }
            return filter.call(null, prop, search);
        });
    }
}
