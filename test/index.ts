import staticify, { StaticifyOptions } from '../index';

const maxAgeNonHashed: number | string = 365 * 24 * 60 * 60 * 1000;
const staticifyOptions: StaticifyOptions = {
  includeAll: true,
  shortHash: false,
  pathPrefix: '/static',
  maxAgeNonHashed: maxAgeNonHashed,
};
const staticified = staticify('/public', staticifyOptions);

console.log(staticified);
