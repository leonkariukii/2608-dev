from django.shortcuts import render
from .models import Student, Course
def student_list(request):
	# Fetch all students and optimize database query by pre-loading linked courses
	students = Student.objects.select_related('course').all()
	# Define context variables to display back-end data inside HTML templates
	context = {
    	'students': students,
    	'total_students': Student.objects.count(),
    	'total_courses': Course.objects.count(),
	}
	
	# Render the request using the specified HTML template
	return render(request, 'students/student_list.html', context) 


# Create your views here.
