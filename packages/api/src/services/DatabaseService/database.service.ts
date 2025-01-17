const createDatabaseService = () => {
  // Public methods
  const test = async () => {
    return 'test'
  };

  // Return public interface
  return {
    test,
  };
};

export { createDatabaseService };
