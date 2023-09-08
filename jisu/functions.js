function throwError(condition, statusCode, message) {
  if (condition) {
    const error = new Error(message);
    error.status = statusCode;
    throw error;
  }
}

function createColumnsQueryText(reqBody) {
  const keys = Object.keys(reqBody);
  return keys.join(",");
}

function createValuesQueryText(reqBody) {
  const keys = Object.values(reqBody);
  return keys.join("','");
}

module.exports = {
  throwError: throwError,
  createColumnsQueryText: createColumnsQueryText,
  createValuesQueryText: createValuesQueryText,
};
