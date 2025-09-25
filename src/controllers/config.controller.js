/**
 * Config Controller
 */

export const getSupportConfig = async (req, res, next) => {
  try {
    const whatsappNumbers = process.env.WHATSAPP_NUMBERS
      ? process.env.WHATSAPP_NUMBERS.split(',').map(num => num.trim())
      : [];

    res.status(200).json({
      success: true,
      data: {
        whatsappNumbers,
        supportEmail: process.env.SUPPORT_EMAIL,
        supportHours: process.env.SUPPORT_HOURS
      }
    });
  } catch (error) {
    next(error);
  }
};
