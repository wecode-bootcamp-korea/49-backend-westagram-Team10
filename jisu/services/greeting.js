const getGreeting = async (req, res) => {
  try {
    return res.status(200).json({ message: "good" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getGreeting,
};
