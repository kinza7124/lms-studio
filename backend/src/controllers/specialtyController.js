const {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getTeacherSpecialties,
  addTeacherSpecialty,
  removeTeacherSpecialty,
  getCourseRequirements,
  addCourseRequirement,
  removeCourseRequirement,
} = require('../models/specialtyModel');

const listSpecialties = async (_req, res) => {
  try {
    const specialties = await getAllSpecialties();
    return res.status(200).json(specialties);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch specialties' });
  }
};

const getSpecialty = async (req, res) => {
  try {
    const specialty = await getSpecialtyById(req.params.id);
    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }
    return res.status(200).json(specialty);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch specialty' });
  }
};

const createSpecialtyHandler = async (req, res) => {
  try {
    const { specialtyName, description } = req.body;
    if (!specialtyName) {
      return res.status(400).json({ message: 'Specialty name is required' });
    }
    const specialty = await createSpecialty({ specialtyName, description });
    return res.status(201).json(specialty);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Specialty name already exists' });
    }
    return res.status(500).json({ message: 'Failed to create specialty' });
  }
};

const updateSpecialtyHandler = async (req, res) => {
  try {
    const updated = await updateSpecialty(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Specialty not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update specialty' });
  }
};

const deleteSpecialtyHandler = async (req, res) => {
  try {
    await deleteSpecialty(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete specialty' });
  }
};

const getTeacherSpecialtiesHandler = async (req, res) => {
  try {
    const { getTeacherByUserId } = require('../models/teacherModel');
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const specialties = await getTeacherSpecialties(teacher.teacher_id);
    return res.status(200).json(specialties);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch teacher specialties' });
  }
};

const addTeacherSpecialtyHandler = async (req, res) => {
  try {
    const { specialtyId } = req.body;
    if (!specialtyId) {
      return res.status(400).json({ message: 'Specialty ID is required' });
    }
    const { getTeacherByUserId } = require('../models/teacherModel');
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const result = await addTeacherSpecialty(teacher.teacher_id, specialtyId);
    if (!result) {
      return res.status(200).json({ message: 'Specialty already assigned' });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to add specialty' });
  }
};

const removeTeacherSpecialtyHandler = async (req, res) => {
  try {
    const { specialtyId } = req.params;
    const { getTeacherByUserId } = require('../models/teacherModel');
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    await removeTeacherSpecialty(teacher.teacher_id, specialtyId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to remove specialty' });
  }
};

const getCourseRequirementsHandler = async (req, res) => {
  try {
    const requirements = await getCourseRequirements(req.params.courseId);
    return res.status(200).json(requirements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch course requirements' });
  }
};

const addCourseRequirementHandler = async (req, res) => {
  try {
    const { specialtyId } = req.body;
    if (!specialtyId) {
      return res.status(400).json({ message: 'Specialty ID is required' });
    }
    const result = await addCourseRequirement(req.params.courseId, specialtyId);
    if (!result) {
      return res.status(200).json({ message: 'Requirement already exists' });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to add course requirement' });
  }
};

const removeCourseRequirementHandler = async (req, res) => {
  try {
    await removeCourseRequirement(req.params.courseId, req.params.specialtyId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to remove course requirement' });
  }
};

module.exports = {
  listSpecialties,
  getSpecialty,
  createSpecialtyHandler,
  updateSpecialtyHandler,
  deleteSpecialtyHandler,
  getTeacherSpecialtiesHandler,
  addTeacherSpecialtyHandler,
  removeTeacherSpecialtyHandler,
  getCourseRequirementsHandler,
  addCourseRequirementHandler,
  removeCourseRequirementHandler,
};

