import staticify, {StaticifyOptions} from '..';

const staticifyOptions: StaticifyOptions = {
    includeAll: true,
    shortHash: false,
    pathPrefix: '/static',
    maxAgeNonHashed: 365 * 24 * 60 * 60 * 1000
};
const staticified = staticify('/public', staticifyOptions);

console.log(staticified);
