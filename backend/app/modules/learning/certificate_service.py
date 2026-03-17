import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import black, blue, darkgray, HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

class CertificateService:
    @staticmethod
    def generate_certificate(student_name: str, course_title: str, completion_date: str, certificate_id: str) -> bytes:
        """
        Generates a PDF certificate as a byte string.
        """
        buffer = io.BytesIO()
        
        # Create the PDF object, using the buffer as its "file."
        # Landscape orientation for a classic certificate look
        c = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)

        # -- Design Background / Border --
        c.setStrokeColor(HexColor('#4F46E5')) # Indigo-600
        c.setLineWidth(5)
        c.rect(0.5 * inch, 0.5 * inch, width - 1 * inch, height - 1 * inch)
        
        c.setStrokeColor(HexColor('#E0E7FF')) # Indigo-100
        c.setLineWidth(2)
        c.rect(0.6 * inch, 0.6 * inch, width - 1.2 * inch, height - 1.2 * inch)

        # -- Header --
        c.setFont("Helvetica-Bold", 40)
        c.setFillColor(HexColor('#1F2937')) # Gray-800
        c.drawCentredString(width / 2, height - 2 * inch, "Certificate of Completion")

        # -- Body --
        c.setFont("Helvetica", 16)
        c.setFillColor(darkgray)
        c.drawCentredString(width / 2, height - 3 * inch, "This is to certify that")

        # Player Name
        c.setFont("Helvetica-Bold", 30)
        c.setFillColor(HexColor('#4F46E5')) # Indigo-600
        c.drawCentredString(width / 2, height - 4 * inch, student_name)

        c.setFont("Helvetica", 16)
        c.setFillColor(darkgray)
        c.drawCentredString(width / 2, height - 5 * inch, "has successfully completed the course")

        # Course Title
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(black)
        c.drawCentredString(width / 2, height - 6 * inch, course_title)

        # -- Footer --
        c.setFont("Helvetica", 12)
        c.setFillColor(darkgray)
        
        # Date
        c.drawString(1.5 * inch, 1.5 * inch, f"Date: {completion_date}")
        c.line(1.5 * inch, 1.4 * inch, 3.5 * inch, 1.4 * inch) # Line for signature/date

        # Certificate ID
        c.drawRightString(width - 1.5 * inch, 1.5 * inch, f"Certificate ID: {certificate_id}")
        
        # Signature Line (Visual only)
        c.line(width - 4 * inch, 1.4 * inch, width - 1.5 * inch, 1.4 * inch)
        c.drawRightString(width - 1.5 * inch, 1.2 * inch, "Course Instructor")

        # -- Close --
        c.showPage()
        c.save()

        # Get the value of the BytesIO buffer and return it
        buffer.seek(0)
        return buffer.read()
