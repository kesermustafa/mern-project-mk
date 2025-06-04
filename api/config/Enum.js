module.exports = {
  HTTP_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    NOT_MODIFIED: 304,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    TIMED_OUT: 408,
    CONFLICT: 409,
    GONE: 410,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INT_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
  },

  MESSAGE:{
    CONFLICT_CATEGORY: "There is a category registered with this name",
    NOT_EMPTY: "Name fields must be filled",
    ID_NOT_FOUND: "No record found for this ID",
  }
};
