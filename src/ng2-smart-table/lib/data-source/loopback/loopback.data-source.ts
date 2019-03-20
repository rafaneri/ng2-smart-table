import { map, tap } from 'rxjs/operators';
import { LoopbackSorter } from './loopback.sorter';
import { LoopbackFilter } from './loopback.filter';
import { LocalDataSource } from '../local/local.data-source';

export class LoopbackDataSource extends LocalDataSource {

    protected lastRequestCount: number = 0;
    data: any = [];

    /**
     * 
     * @param api BaseLoopBackApi
     * @param columns Entity fields
     * @param includes Loopback model includes on find
     * @param idName Identifier field name
     */
    constructor(protected api: any,
        protected columns: any,
        protected includes: any[] = [],
        protected idName: string = 'id') {
        super();
    }

    prepend(element: any): Promise<any> {
        return this.api.create(element).pipe(map(res => {
            return super.prepend(res);
        })).toPromise();
    }

    add(element: any): Promise<any> {
        return this.api.create(element).pipe(map(res => {
            return super.add(res);
        })).toPromise();
    }

    update(element: any, values: any): Promise<any> {
        return new Promise((resolve, reject) => {
            delete values[this.idName];
            this.api.updateAttributes(element[this.idName], values).subscribe((result: any) => {
                // it's a nice trick from https://github.com/akveo/ng2-smart-table/issues/195#issuecomment-311799579
                element = Object.assign(element, result);
                this.emitOnUpdated(element);
                this.emitOnChanged('update');
                resolve();
            }, (err: any) => {
                reject(err);
            });
        });
    }

    remove(element: any): Promise<any> {
        return this.api.deleteById(element[this.idName]).pipe(map(res => {
            return super.remove(element);
        })).toPromise();
    }

    count(): number {
        return this.lastRequestCount;
    }

    getElements(): Promise<any> {
        let filter = this.addSortRequestParams({});
        filter = this.addFilterRequestParams(filter);
        filter = this.addPagerRequestParams(filter);

        if (this.includes) {
            filter.include = this.includes;
        }

        this.api.count(filter.where).subscribe((result: { count: number; }) => {
            this.lastRequestCount = result.count;
        });

        return this.api.find(filter).pipe(tap((res) => {
            this.data = res;
            return this.data;
        })).toPromise();
    }

    protected sort(data: any[]): any[] {
        if (this.sortConf) {
            this.sortConf.forEach((fieldConf) => {
                data = LoopbackSorter
                    .sort(data, fieldConf['field'], fieldConf['direction'], fieldConf['compare']);
            });
        }
        return data;
    }

    // TODO: refactor?
    protected filter(data: any[]): any[] {
        if (this.filterConf.filters) {
            if (this.filterConf.andOperator) {
                this.filterConf.filters.forEach((fieldConf: any) => {
                    if (fieldConf['search'].length > 0) {
                        data = LoopbackFilter
                            .filter(data, fieldConf['field'], fieldConf['search'], fieldConf['filter']);
                    }
                });
            } else {
                let mergedData: any = [];
                this.filterConf.filters.forEach((fieldConf: any) => {
                    if (fieldConf['search'].length > 0) {
                        mergedData = mergedData.concat(LoopbackFilter
                            .filter(data, fieldConf['field'], fieldConf['search'], fieldConf['filter']));
                    }
                });
                // remove non unique items
                data = mergedData.filter((elem: any, pos: any, arr: any) => {
                    return arr.indexOf(elem) === pos;
                });
            }
        }
        return data;
    }

    protected addSortRequestParams(filter: any): any {
        if (this.sortConf) {
            const order: any = [];
            this.sortConf.forEach((fieldConf) => {
                order.push(`${fieldConf.field} ${fieldConf.direction.toUpperCase()}`);
            });
            filter['order'] = order;
        }

        return filter;
    }

    protected addFilterRequestParams(filter: any): any {
        if (this.filterConf.filters) {
            const where: any = {};
            this.filterConf.filters.forEach((fieldConf: any) => {
                if (fieldConf['search']) {
                    if (this.columns[fieldConf['field']].type === 'text') {
                        where[fieldConf['field']] = { like: fieldConf['search'], options: 'i' };
                    } else {
                        where[fieldConf['field']] = fieldConf['search'];
                    }
                }
            });
            filter.where = where;
        }

        return filter;
    }

    protected addPagerRequestParams(filter: any): any {
        if (this.pagingConf && this.pagingConf['page'] && this.pagingConf['perPage']) {
            filter.skip = this.pagingConf['page'] - 1;
            filter.limit = this.pagingConf['perPage'];
        }

        return filter;
    }
}
