export class LoopbackSorter {

    protected static COMPARE = (direction: any, a: any, b: any) => {
        if (a < b) {
            return -1 * direction;
        }
        if (a > b) {
            return direction;
        }
        return 0;
    }

    static sort(data: Array<any>, field: string, direction: string, customCompare?: Function): Array<any> {

        const dir: number = (direction === 'asc') ? 1 : -1;
        const compare: Function = customCompare ? customCompare : this.COMPARE;

        return data.sort((a, b) => {
            const parts = field.split('.');
            let propA = a;
            for (let i = 0; i < parts.length && typeof propA !== 'undefined'; i++) {
                propA = propA[parts[i]];
            }
            let propB = b;
            for (let i = 0; i < parts.length && typeof propB !== 'undefined'; i++) {
                propB = propB[parts[i]];
            }
            return compare.call(null, dir, propA, propB);
        });
    }
}